// Manager transfer OTP — init sends a code via SMS, verify consumes it server-side.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function maskPhone(p: string) {
  const s = String(p || "").replace(/\D/g, "");
  if (s.length < 7) return s;
  return s.slice(0, 4) + "***" + s.slice(-3);
}

async function sendKavenegar(apiKey: string, sender: string, receptor: string, message: string) {
  const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
  const params = new URLSearchParams({ receptor, sender, message });
  const res = await fetch(`${url}?${params}`);
  const data = await res.json();
  if (!res.ok || data?.return?.status !== 200) throw new Error(`Kavenegar: ${data?.return?.message || res.statusText}`);
}

async function sendSmsIr(apiKey: string, sender: string, receptor: string, message: string) {
  const cleanLine = String(sender).replace(/\D/g, "");
  const cleanPhone = String(receptor).replace(/\D/g, "");
  const res = await fetch("https://api.sms.ir/v1/send/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "text/plain", "x-api-key": apiKey },
    body: JSON.stringify({ lineNumber: Number(cleanLine), messageText: message, mobiles: [cleanPhone] }),
  });
  const text = await res.text();
  let data: any = null; try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok || !data || data.status !== 1) throw new Error(`SMS.ir: ${data?.message || text || res.status}`);
}

async function sendMelipayamak(username: string, password: string, sender: string, receptor: string, message: string) {
  const res = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, to: receptor, from: sender, text: message, isflash: false }),
  });
  const data = await res.json();
  if (!res.ok || (data?.RetStatus !== 1 && data?.Value === undefined)) throw new Error(`Melipayamak: ${data?.StrRetStatus || res.statusText}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // user client (respects RLS) for permission check
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const action = body?.action;

    if (action === "init") {
      const { building_id, role_id, new_manager_id, effective_date } = body;
      if (!building_id || !role_id || !new_manager_id) {
        return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Permission check: caller must be a manager of this building (or super admin)
      const { data: memberRow } = await admin.from("building_members")
        .select("role").eq("user_id", user.id).eq("building_id", building_id).maybeSingle();
      const { data: isSuper } = await admin.rpc("has_role", { _user_id: user.id, _role: "super_admin" });
      const isManager = memberRow?.role === "manager";
      if (!isManager && !isSuper) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Resolve new manager phone
      const { data: mgr, error: mgrErr } = await admin.from("managers")
        .select("id, mobile, unit_id, role_type, external_name, building_id, unit:units(phone, resident_phone, owner_name, resident_name)")
        .eq("id", new_manager_id).maybeSingle();
      if (mgrErr || !mgr || mgr.building_id !== building_id) {
        return new Response(JSON.stringify({ error: "مدیر مقصد یافت نشد" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      let phone: string | null = mgr.mobile || null;
      if (!phone && mgr.unit) {
        phone = mgr.role_type === "owner" ? (mgr.unit as any).phone : ((mgr.unit as any).resident_phone || (mgr.unit as any).phone);
      }
      if (!phone) {
        return new Response(JSON.stringify({ error: "شماره موبایل مدیر جدید ثبت نشده است" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Generate OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const eff = effective_date || new Date().toISOString().slice(0, 10);

      const { data: otpRow, error: insErr } = await admin.from("manager_transfer_otps").insert({
        building_id, role_id, new_manager_id,
        recipient_phone: phone, effective_date: eff,
        code, expires_at: expires, created_by: user.id,
      }).select("id").single();
      if (insErr) throw insErr;

      // Send SMS via provider
      const { data: settings } = await admin.from("sms_settings").select("*").eq("building_id", building_id).maybeSingle();
      if (!settings || !settings.is_enabled) {
        return new Response(JSON.stringify({ error: "سامانه پیامک برای این ساختمان فعال نیست" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: bld } = await admin.from("buildings").select("name").eq("id", building_id).maybeSingle();
      const message = `کد تایید انتقال مدیریت ساختمان ${bld?.name || ""}: ${code}\nاین کد را به مدیر فعلی اعلام کنید. اعتبار: ۱۰ دقیقه.`;

      try {
        const provider = settings.active_provider as string;
        if (provider === "kavenegar") {
          await sendKavenegar(settings.kavenegar_api_key, settings.kavenegar_sender ?? "", phone, message);
        } else if (provider === "smsir") {
          await sendSmsIr(settings.smsir_api_key, settings.smsir_sender ?? "", phone, message);
        } else if (provider === "melipayamak") {
          await sendMelipayamak(settings.melipayamak_username, settings.melipayamak_password, settings.melipayamak_sender ?? "", phone, message);
        } else {
          throw new Error(`Unknown provider: ${provider}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error: `ارسال پیامک ناموفق بود: ${msg}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await admin.from("sms_logs").insert({
        building_id, template_key: "manager_transfer_otp",
        recipient_phone: phone, message_body: message,
        provider: settings.active_provider, status: "sent",
      });

      return new Response(JSON.stringify({ otp_id: otpRow.id, phone_masked: maskPhone(phone) }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const { otp_id, code } = body;
      if (!otp_id || !code) {
        return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error: rpcErr } = await userClient.rpc("consume_manager_transfer_otp", { _otp_id: otp_id, _code: String(code) });
      if (rpcErr) {
        return new Response(JSON.stringify({ error: rpcErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
