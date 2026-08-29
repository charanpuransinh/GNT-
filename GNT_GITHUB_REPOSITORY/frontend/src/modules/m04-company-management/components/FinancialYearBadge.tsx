import React from "react";
import { Badge } from "../../../components/ui";
interface Props { fy: any; isActive: boolean; }
export const FinancialYearBadge: React.FC<Props> = ({ fy, isActive }) => (
  <Badge variant={isActive ? "success" : "secondary"}>
    {fy.startDate?.slice(0,4)}-{fy.endDate?.slice(0,4)} {isActive && "(Active)"}
  </Badge>
);