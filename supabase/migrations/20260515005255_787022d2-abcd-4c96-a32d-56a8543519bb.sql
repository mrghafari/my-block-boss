REVOKE EXECUTE ON FUNCTION public.resident_pay_and_clear(uuid, uuid, jsonb, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resident_pay_and_clear(uuid, uuid, jsonb, uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.resident_pay_and_clear(uuid, uuid, jsonb, uuid[]) TO authenticated;