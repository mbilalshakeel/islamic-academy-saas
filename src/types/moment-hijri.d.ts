declare module "moment-hijri" {
  import { Moment as OriginalMoment } from "moment";

  interface HijriMoment extends OriginalMoment {
    iYear(): number;
    iYear(y: number): HijriMoment;
    iMonth(): number;
    iMonth(m: number): HijriMoment;
    iDate(): number;
    iDate(d: number): HijriMoment;
  }

  interface HijriMomentStatic {
    (input?: string, format?: string): HijriMoment;
    (): HijriMoment;
  }

  const momentHijri: HijriMomentStatic;
  export = momentHijri;
}
