export type Category = "Engine & Drivetrain" | "Chassis & Suspension" | "Body & Electrical";
export type Severity = "HIGH" | "MED" | "LOW";
export type Urgency = "Immediate" | "Soon" | "Monitor";

export interface IssuePart {
  name: string;
  partNumber?: string;
  priceUsd?: number;
  source: "RockAuto" | "eBay Motors" | "OEM Dealer" | "Estimated";
  url?: string;
}

export interface Issue {
  id: string;
  label: string;
  category: Category;
  severity: Severity;
  costMin: number;
  costMax: number;
  partsCostMin: number;
  partsCostMax: number;
  labourHours: number;
  explanation: string;
  urgency: Urgency;
  parts?: IssuePart[];
}

export interface Vehicle {
  year: number | null;
  make: string;
  model: string;
  trim?: string;
  mileage?: number | null;
  engineType?: string;
  vin?: string;
}

export interface Recall {
  id: string;
  date: string;
  component: string;
  status: "Open" | "Remedied";
  description?: string;
}

export interface RoadmapItem {
  urgency: Urgency;
  label: string;
  reason: string;
  issueIds: string[];
}

export interface ReportRecommendation {
  verdict: "buy" | "negotiate" | "walkaway";
  headline: string;
  summary: string;
  roadmap: RoadmapItem[];
}