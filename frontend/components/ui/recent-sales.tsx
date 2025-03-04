import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface RecentSale {
  name: string;
  phone: string;
  ntn_number: string;
  purchase: string;
  avatarUrl?: string;
}

interface RecentSalesProps {
  data: RecentSale[];
}

export function RecentSales({ data }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {data.map((sale, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={sale.avatarUrl} alt={`${sale.name}'s avatar`} />
            <AvatarFallback>
              {sale.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.phone}</p>
            <p className="text-sm text-muted-foreground">({sale.ntn_number})</p>
          </div>
          <div className="ml-auto font-medium">+{sale.purchase}</div>
        </div>
      ))}
    </div>
  );
}