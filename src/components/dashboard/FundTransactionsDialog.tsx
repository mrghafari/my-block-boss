import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePayments, FundType } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { formatJalaliDate } from "@/lib/jalaliDate";

interface FundTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundType: FundType;
  fundName: string;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("fa-IR").format(amount);
};

export function FundTransactionsDialog({
  open,
  onOpenChange,
  fundType,
  fundName,
}: FundTransactionsDialogProps) {
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();

  const fundPayments = payments.filter((p) => p.fund_type === fundType);
  const fundExpenses = expenses.filter((e) => e.fund_type === fundType);

  // Combine and sort by date (oldest first for running balance)
  const transactions = [
    ...fundPayments.map((p) => ({
      id: p.id,
      type: "credit" as const,
      amount: Number(p.amount),
      date: p.payment_date,
      description: p.description || `پرداخت واحد ${p.units?.unit_number || "-"}`,
    })),
    ...fundExpenses.map((e) => ({
      id: e.id,
      type: "debit" as const,
      amount: Number(e.amount),
      date: e.expense_date,
      description: e.title,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = transactions.map((t) => {
    if (t.type === "credit") {
      runningBalance += t.amount;
    } else {
      runningBalance -= t.amount;
    }
    return { ...t, balance: runningBalance };
  });

  // Reverse for display (newest first)
  const displayTransactions = [...transactionsWithBalance].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            دفتر {fundName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {displayTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ تراکنشی ثبت نشده است
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right w-24">تاریخ</TableHead>
                  <TableHead className="text-right">شرح</TableHead>
                  <TableHead className="text-center w-28">بدهکار</TableHead>
                  <TableHead className="text-center w-28">بستانکار</TableHead>
                  <TableHead className="text-center w-28">مانده</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatJalaliDate(transaction.date)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.type === "debit" ? (
                        <span className="text-red-600 font-medium">
                          {formatAmount(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.type === "credit" ? (
                        <span className="text-green-600 font-medium">
                          {formatAmount(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-bold ${
                          transaction.balance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatAmount(Math.abs(transaction.balance))}
                        {transaction.balance < 0 && " -"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
