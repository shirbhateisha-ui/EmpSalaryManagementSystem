import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TopEarner } from '../types/analytics.types';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function TopEarnersTable({ earners }: { earners: TopEarner[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Annual (USD)</TableHead>
          <TableHead className="text-right">Monthly (USD)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {earners.map((e, i) => (
          <TableRow key={e.id}>
            <TableCell className="text-muted-foreground font-medium">{i + 1}</TableCell>
            <TableCell className="font-medium">
              <Link to={`/employees/${e.id}`} className="hover:underline text-primary">
                {e.name}
              </Link>
            </TableCell>
            <TableCell>{e.department}</TableCell>
            <TableCell>{e.country}</TableCell>
            <TableCell className="text-right">{USD.format(e.annual_usd)}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {USD.format(e.monthly_usd)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
