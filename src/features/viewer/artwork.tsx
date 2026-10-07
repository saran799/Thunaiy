import type { ComponentType } from 'react';
import FigmaImg from '../../components/FigmaImg';
import type { FormFieldRect } from './types';

/** The drawn form content. Backgrounds of highlighted fields are transparent: the overlay draws the tint beneath. */
interface ArtworkProps {
  fields: FormFieldRect[];
}

const on = (fields: FormFieldRect[], id: string) => fields.find((f) => f.id === id)?.applicable ?? false;

const NAME_CELLS = ['R', 'A', 'J', 'E', 'S', 'H', '', 'K', 'U', 'M', 'A', 'R'];
const MOBILE_DIGITS = ['9', '8', '4', '0', '1', '2', '3', '4', '5', '6'];
const DOB_GROUPS: string[][] = [['1', '4'], ['0', '8'], ['1', '9', '9', '4']];
const BRANCH_CELLS = [
  { label: 'CIF Generated', value: '__ / __ / ____', bold: false },
  { label: 'Clearing Code', value: 'N-1099', bold: false },
  { label: 'Officer SS No.', value: '_____', bold: false },
  { label: 'Risk Cat.', value: 'LOW', bold: true },
];

function Tag({ children, className }: { children: string; className: string }) {
  return <span className={`inline-flex h-[8.75px] shrink-0 items-center rounded-[4px] px-[4px] uppercase ${className}`}>{children}</span>;
}

function SbiPage1({ fields }: ArtworkProps) {
  return (
    <div className="relative size-full">
      {/* Letterhead */}
      <div className="absolute left-[16px] right-[16px] top-[16px] flex items-start justify-between pb-[4px]">
        <div className="flex items-center gap-[8px]">
          <div className="relative size-[32px] shrink-0 rounded-full bg-sbi-blue" aria-hidden="true">
            <div className="absolute left-[9px] top-[6px] size-[14px] rounded-full bg-white" />
            <div className="absolute bottom-[4px] left-[14px] h-[10px] w-[4px] bg-white" />
          </div>
          <div>
            <p className="font-devanagari text-[11px] font-semibold uppercase leading-[11px] tracking-[-0.275px] text-sbi-blue">भारतीय स्टेट बैंक</p>
            <p className="pb-[0.88px] text-[13px] font-bold uppercase leading-[17.88px] tracking-[-0.325px] text-sbi-blue">STATE BANK OF INDIA</p>
            <p className="pt-px text-[8px] font-semibold uppercase leading-[10px] tracking-[0.4px] text-[#475569]">Customer Account Opening Form (Part-I)</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-[2px] pt-px">
          <span className="rounded-[4px] bg-[#f1f5f9] px-[6px] py-[2px] font-mono text-[8px] font-bold leading-[10px] text-[#334155]">FORM 60 / A-1</span>
          <span className="text-[7.5px] leading-[9.38px] text-[#64748b]">KYC Compliant (V.4.2)</span>
        </div>
      </div>

      {/* Notice strip */}
      <div className="absolute left-[16px] right-[16px] top-[62.88px] flex items-center justify-between bg-[#f8fafc] px-[8px] py-[4px]">
        <span className="whitespace-nowrap font-mono text-[7.5px] leading-[9.38px] text-[#475569]">FIELDS MARKED * ARE STRICTLY MANDATORY</span>
        <span className="whitespace-nowrap font-mono text-[7.5px] leading-[9.38px] text-[#475569]">REVISE CIRCULAR: NBG/RB/2023-24</span>
      </div>

      {/* Section header */}
      <div className="absolute left-[16px] right-[16px] top-[88.25px] flex items-center justify-between bg-sbi-blue px-[8px] py-[4px]">
        <span className="whitespace-nowrap text-[8.5px] font-bold uppercase leading-[10.63px] tracking-[0.425px] text-white">Section 1: Applicant Profile &amp; Identification</span>
        <span className="whitespace-nowrap text-[7px] uppercase leading-[8.75px] tracking-[0.425px] text-[#cbd5e1]">Individual Resident</span>
      </div>

      {/* 1. Account type */}
      <div className="absolute left-[16px] top-[110.88px] flex h-[38.99px] w-[221.333px] flex-col justify-center gap-[3.99px] p-[6px]">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-bold leading-[10.63px] text-teal">1. ACCOUNT TYPE *</span>
          {on(fields, 'account-type') && <Tag className="bg-teal text-[7px] font-semibold leading-[8.75px] text-white">Required</Tag>}
        </div>
        <div className="flex gap-[4px]">
          <div className="flex flex-1 items-center gap-[4px]">
            <span className="flex size-[12px] items-center justify-center rounded-full bg-teal">
              <span className="size-[6px] rounded-full bg-white" />
            </span>
            <span className="text-[8px] font-semibold leading-[10px] text-[#0f172a]">Savings Bank A/c</span>
          </div>
          <div className="flex flex-1 items-center gap-[4px]">
            <span className="size-[12px] rounded-full bg-track" />
            <span className="text-[8px] leading-[10px] text-[#64748b]">Current Deposit</span>
          </div>
        </div>
      </div>

      {/* Staff / senior citizen (not applicable) */}
      <div className="absolute left-[16px] top-[153.86px] flex h-[43.375px] w-[221.333px] items-end gap-[4px] bg-[#fbfcfd] px-[4px] pb-[4px] pt-[3.375px]">
        <div className="flex flex-1 flex-col gap-[2px]">
          <span className="font-mono text-[7px] leading-[8.75px] text-[#64748b]">STAFF ACCOUNT ID (IF APPLICABLE)</span>
          <div className="h-[16px] bg-[rgba(217,227,241,0.4)]" />
        </div>
        <div className="flex flex-1 flex-col gap-[2px] pb-[8.75px]">
          <span className="font-mono text-[7px] leading-[8.75px] text-[#64748b]">SENIOR CITIZEN CERT. NO.</span>
          <div className="h-[16px] bg-[rgba(217,227,241,0.4)]" />
        </div>
      </div>

      {/* Photo */}
      <div className="absolute left-[241.333px] top-[110.88px] flex h-[106px] w-[108.667px] flex-col items-center justify-center p-[4px]">
        <FigmaImg id="877f6" />
        <p className="pt-[4px] text-center text-[7.5px] font-bold leading-[9.38px] text-teal">AFFIX RECENT PHOTO</p>
        <p className="px-[13.4px] text-center text-[6.5px] leading-[8.13px] text-[#334155]">3.5 cm x 4.5 cm (Cross-signature required)</p>
        {on(fields, 'photo') && (
          <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-deep px-[4px] text-[6.5px] font-semibold leading-[8.13px] text-white">
            Doc 1: Photo
          </span>
        )}
      </div>

      {/* 2. Full name */}
      <div className="absolute left-[16px] top-[220.88px] flex w-[334px] flex-col gap-[2px] p-[6px]">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-bold uppercase leading-[10.63px] text-teal">2. Applicant Full Name (Same as PAN / Aadhaar) *</span>
          {on(fields, 'full-name') && <Tag className="bg-cyan text-[7px] font-medium leading-[8.75px] text-teal-ink">1. Fill in block letters</Tag>}
        </div>
        <div className="flex gap-[2px] pt-[1.99px]">
          {NAME_CELLS.map((c, i) => (
            <div
              key={i}
              className={`flex h-[20px] flex-1 items-center justify-center font-mono text-[8.5px] font-bold leading-[10.63px] text-deep ${c ? 'bg-white' : 'bg-[rgba(255,255,255,0.5)]'}`}
            >
              {c}
            </div>
          ))}
        </div>
        <div className="flex gap-[2px]">
          {NAME_CELLS.map((_, i) => (
            <div key={i} className="h-[16px] flex-1 bg-[rgba(255,255,255,0.6)]" />
          ))}
        </div>
      </div>

      {/* 3. Date of birth */}
      <div className="absolute left-[16px] top-[289.5px] flex h-[45.5px] w-[136.833px] flex-col gap-px p-[6px]">
        <span className="text-[8px] font-bold leading-[10px] text-teal">3. DATE OF BIRTH *</span>
        <div className="flex items-center gap-[2px] pt-[2.5px]">
          {DOB_GROUPS.map((group, gi) => (
            <div key={gi} className="flex items-center gap-[2px]">
              {gi > 0 && <span className="px-[2px] font-mono text-[8px] leading-[10px] text-[#64748b]">/</span>}
              {group.map((d, di) => (
                <span key={di} className="flex w-[11.15px] items-center justify-center bg-white font-mono text-[8px] font-bold leading-[10px] text-[#0f172a]">
                  {d}
                </span>
              ))}
            </div>
          ))}
        </div>
        <span className="whitespace-pre font-mono text-[6.5px] leading-[8.13px] text-[#64748b]">D D   M M   Y Y Y Y</span>
      </div>

      {/* 4. Mobile */}
      <div className="absolute left-[156.833px] top-[289.5px] flex h-[46.5px] w-[193.167px] flex-col gap-[2px] p-[6px]">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold leading-[10px] text-teal">4. MOBILE (+91) *</span>
          <span className="text-[7px] font-medium leading-[8.75px] text-teal">OTP Verification</span>
        </div>
        <div className="flex gap-[2px] pt-[1.5px]">
          {MOBILE_DIGITS.map((d, i) => (
            <span key={i} className="flex h-[10px] flex-1 items-center justify-center bg-white font-mono text-[8px] font-bold leading-[10px] text-[#0f172a]">
              {d}
            </span>
          ))}
        </div>
        <span className="text-[6.5px] leading-[8.13px] text-[#64748b]">Primary number registered with UIDAI</span>
      </div>

      {/* Minor / guardian (not applicable) */}
      <div className="absolute left-[16px] top-[339.63px] flex h-[48.74px] w-[334px] flex-col gap-[1.99px] bg-[#f8fafc] p-[6px] opacity-70">
        <span className="text-[7.5px] font-bold uppercase leading-[9.38px] text-[#64748b]">For minor account only (leave blank if adult)</span>
        <div className="grid grid-cols-2 gap-[8px]">
          {['Guardian CIF Number', 'Relationship with Minor'].map((label) => (
            <div key={label} className="flex flex-col gap-[2.75px]">
              <span className="text-[7px] leading-[8.75px] text-[#64748b]">{label}</span>
              <div className="h-[14px] bg-[rgba(217,227,241,0.3)]" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Address */}
      <div className="absolute left-[16px] top-[391.75px] flex h-[63.135px] w-[334px] flex-col gap-[4px] p-[6px]">
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-bold uppercase leading-[10.63px] text-teal">5. Current Residential Address *</span>
          {on(fields, 'address') && <Tag className="bg-teal text-[7px] font-medium leading-[8.75px] text-white">As per Proof of Address</Tag>}
        </div>
        <div className="flex h-[9.38px] items-center bg-white px-[6px] pb-[1.38px] font-mono text-[7.5px] leading-[9.38px] text-[#1e293b]">FLAT 402, SHIVAM RESIDENCY, 2ND CROSS</div>
        <div className="flex h-[9.38px] items-center bg-white px-[6px] pb-[1.38px] font-mono text-[7.5px] leading-[9.38px] text-[#1e293b]">KORAMANGALA 4TH BLOCK, BENGALURU</div>
        <div className="grid h-[9.38px] grid-cols-2 gap-[4px]">
          <div className="flex items-center bg-white px-[6px] pb-[1.38px] font-mono text-[7.5px] leading-[9.38px] text-[#1e293b]">KARNATAKA</div>
          <div className="flex items-center bg-white px-[6px] pb-[1.38px] font-mono text-[7.5px] leading-[9.38px] text-[#1e293b]">PIN: 560034</div>
        </div>
      </div>

      {/* Branch office use (not applicable) */}
      <div className="absolute bottom-[33.37px] left-[16px] right-[16px] flex flex-col gap-[4px] rounded-[2px] bg-[#f1f5f9] p-[6px]">
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap text-[7.5px] font-bold uppercase leading-[9.38px] tracking-[0.188px] text-[#475569]">For branch office use only (do not fill)</span>
          <span className="whitespace-nowrap font-mono text-[7.5px] font-bold uppercase leading-[9.38px] tracking-[0.188px] text-[#475569]">Branch Code: 04221</span>
        </div>
        <div className="flex h-[20px] gap-[4px]">
          {BRANCH_CELLS.map((c) => (
            <div key={c.label} className="flex flex-1 flex-col justify-between bg-[rgba(255,255,255,0.8)] px-[2px] pb-[1.12px] pt-px">
              <span className="whitespace-nowrap text-[7px] leading-[8.75px] text-[#64748b]">{c.label}</span>
              <span className={`whitespace-nowrap font-mono text-[6.5px] leading-[8.13px] ${c.bold ? 'font-bold text-ink' : 'text-[#64748b]'}`}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-[16px] right-[16px] top-[503.88px] flex items-center justify-between pt-[4px]">
        <span className="text-[7.5px] leading-[9.38px] text-[#64748b]">SBI-AOF-VER4-DEC2023</span>
        <span className="text-[7.5px] font-semibold leading-[9.38px] text-deep">Page 1 of 2</span>
      </div>
    </div>
  );
}

function SbiPage2Peek() {
  return (
    <div className="flex size-full flex-col p-[16px]">
      <div className="flex items-center justify-between pb-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-sbi-blue" aria-hidden="true">
            <span className="size-[8px] rounded-full bg-white" />
          </span>
          <span className="whitespace-nowrap text-[9px] font-bold uppercase leading-[11.25px] text-sbi-blue">State Bank of India - Part II: Nomination &amp; Terms</span>
        </div>
        <span className="whitespace-nowrap text-[8px] font-semibold leading-[10px] text-deep">Page 2 of 2</span>
      </div>
      <div className="mt-[4px] flex flex-col gap-[6px] rounded-[2px] bg-[#f8fafc] p-[8px]">
        <div className="h-[12px] w-[106px] rounded-[2px] bg-[rgba(217,227,241,0.4)]" />
        <div className="h-[16px] rounded-[2px] bg-[rgba(217,227,241,0.3)]" />
        <div className="h-[16px] rounded-[2px] bg-[rgba(217,227,241,0.3)]" />
        <div className="flex justify-between pt-[8px]">
          {['Applicant Specimen Signature', 'Nominee Acknowledgement'].map((t) => (
            <div key={t} className="flex h-[40px] w-[128px] items-end justify-center rounded-[2px] bg-[rgba(217,227,241,0.2)] pb-[4px]">
              <span className="text-center text-[7px] leading-[8.75px] text-[#64748b]">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Maps FormPageSpec.artwork keys to the drawn page content. Add new banks/forms here. */
export const artworkRegistry: Record<string, ComponentType<ArtworkProps>> = {
  'sbi-aof-page-1': SbiPage1,
  'sbi-aof-page-2-peek': SbiPage2Peek,
};
