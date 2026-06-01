export type Category = "Engine & Drivetrain" | "Chassis & Suspension" | "Body & Electrical";

export interface Issue {
  id: string;
  label: string;
  cost: number;
  category: Category;
}

export interface Vehicle {
  year: number | null;
  make: string;
  model: string;
}
