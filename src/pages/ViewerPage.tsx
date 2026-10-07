import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import ProfileButton from '../components/ProfileButton';
import FormViewer from '../features/viewer/FormViewer';
import ViewerControls from '../features/viewer/ViewerControls';
import { sbiAccountOpening } from '../features/viewer/sbiAccountOpening';
import { useViewerZoom } from '../features/viewer/useViewerScale';

export default function ViewerPage() {
  const navigate = useNavigate();
  const { zoom } = useViewerZoom();
  const doc = sbiAccountOpening;
  const required = doc.fields.filter((f) => f.applicable && f.required).length;
  return (
    <Screen className="pt-[56px]">
      <header className="fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[430px] bg-[rgba(247,249,255,0.8)] shadow-header backdrop-blur-[12px]">
        <div className="flex h-[56px] items-center justify-between px-[12px]">
          <button type="button" aria-label="Go back" onClick={() => navigate('/purpose')} className="flex size-[44px] items-center justify-center rounded-full">
            <FigmaImg id="ff924" />
          </button>
          <h1 className="whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-deep">{doc.form} Page 1</h1>
          <div className="flex items-center gap-[8px]">
            <span className="rounded-full bg-surface-3 px-[8px] py-[4px] text-[11px] font-semibold leading-[14px] tracking-[0.275px] text-teal">1 / {doc.pages.length}</span>
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-[96px]">
        <div className="z-[2] flex justify-center px-[16px] py-[4px]">
          <div className="flex items-center gap-[4px] rounded-full bg-[rgba(255,255,255,0.95)] px-[16px] py-[4px] backdrop-blur-[6px]">
            <span className="size-[8px] shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <p className="text-[11px] font-medium leading-[14px] tracking-[-0.275px] text-deep">
              Highlighted in teal: <span className="font-semibold text-teal">{required} required fields</span> for {doc.purposeLabel}
            </p>
            <span className="pl-[4px] font-mono text-[11px] leading-[16.5px] text-outline">P.1</span>
          </div>
        </div>
        <div className="flex-1 overflow-x-hidden px-[12px] py-[8px]">
          <FormViewer document={doc} zoom={zoom} />
        </div>
      </main>
      <ViewerControls zoom={zoom} />
    </Screen>
  );
}
