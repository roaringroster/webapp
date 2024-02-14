import { CustomField } from "./generic";
import { IdentifiableType, createIdentifiable } from "./identifiable";

type WorkAgreementsProps = {
  employeeId: string;
  jobTitle: string;
  jobDescription: string;
  positions: string[];
  customFields: CustomField<any>[];

  employmentStart: Date | null;
  employmentEnd: Date | null;
  weeklyHours: number | null;
  yearlyVacationDays: number | null;
  grossSalary: number | null;
  salaryNotes: string;

  /*
  Qualifikationen
  Geburtsort
  Nationalität
  Familienstand
  Geburtsort
  Höchster Schulabschluss
  Vertrag, Änderungen (Dateien)
  Probezeitende
  Gehaltstyp
  Soll-Stunden-Vereinbarungen (Liste):
    Beginn
    pro Woche
    pro Tag
    nicht überschreitbar?
  Urlaubsanspruch:
    Start, Ende
    Anzahl Tage
    Name
    Anzahl
    Ablaufdatum
  Krankenkasse, -nummer
  Sozialversicherungsnummer
  Bankverbindung
  Dokumente
  länderspezifisch: 
    Steuer-ID
    Steuerklasse
    Kinderfreibetrag
  */

  /* maybe later:
   - Zweitversicherung (Gesundheit)
   - Gesellschaft (Firma)
   - Kostenstelle, Kostenträger
   - Lohnbuchhaltung
   - Vorgesetzter?
   - Gehalt: Bonus, Zusatzbenefits/Variable Vergütung
   - Firmenfahrzeug
   - Zuschüsse
   - emergency contact
   - länderspezifisch:
     - Kirchensteuerpflichtig
     - Behinderungsstatus
     - Betriebliche Altersvorsorge
  */
};

export type WorkAgreements = IdentifiableType & WorkAgreementsProps;


export const createWorkAgreements = ({
  employeeId = "",
  jobTitle = "",
  jobDescription = "",
  positions = [],
  customFields = [],
  employmentStart = null,
  employmentEnd = null,
  weeklyHours = null,
  yearlyVacationDays = null,
  grossSalary = null,
  salaryNotes = "",
}: Partial<WorkAgreementsProps> = {}): WorkAgreements => ({
  ...createIdentifiable(),
  employeeId,
  jobTitle,
  jobDescription,
  positions,
  customFields,
  employmentStart,
  employmentEnd,
  weeklyHours,
  yearlyVacationDays,
  grossSalary,
  salaryNotes,
} as WorkAgreements);
