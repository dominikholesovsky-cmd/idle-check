export type Category = "Engine & Drivetrain" | "Chassis & Suspension" | "Body & Electrical";
export type Severity = "HIGH" | "MED" | "LOW";

export interface Issue {
  id: string;
  label: string;
  category: Category;
  severity: Severity;
  costMin: number;
  costMax: number;
  explanation: string;
}

export interface Vehicle {
  year: number | null;
  make: string;
  model: string;
  trim?: string;
  mileage?: number | null;
}

export interface Recall {
  id: string;
  date: string; // e.g. "Mar 2008"
  component: string;
  status: "Open" | "Remedied";
}
