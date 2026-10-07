import FieldHitLayer from './FieldHitLayer';
import FormPageFrame from './FormPageFrame';
import { artworkRegistry } from './artwork';
import type { FormDocument, FormFieldRect } from './types';

interface Props {
  document: FormDocument;
  zoom: number;
  selectedFieldId: string | null;
  /** False when the user has switched field guidance off in Settings. */
  fieldsInteractive: boolean;
  describeField: (field: FormFieldRect) => string;
  onSelectField: (field: FormFieldRect) => void;
  registerPageRef?: (page: number, element: HTMLDivElement | null) => void;
}

/** Generic viewer: renders any FormDocument. Bank/form specific artwork is looked up from the registry. */
export default function FormViewer({
  document,
  zoom,
  selectedFieldId,
  fieldsInteractive,
  describeField,
  onSelectField,
  registerPageRef,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-[24px]">
      {document.pages.map((page) => {
        const Artwork = artworkRegistry[page.artwork];
        const pageFields = document.fields.filter((field) => field.page === page.page);
        return (
          <FormPageFrame
            key={page.page}
            page={page}
            fields={document.fields}
            zoom={zoom}
            frameRef={(element) => registerPageRef?.(page.page, element)}
            hitLayer={
              fieldsInteractive ? (
                <FieldHitLayer
                  fields={pageFields}
                  selectedFieldId={selectedFieldId}
                  describeField={describeField}
                  onSelectField={onSelectField}
                />
              ) : null
            }
          >
            {Artwork ? <Artwork fields={document.fields} /> : null}
          </FormPageFrame>
        );
      })}
    </div>
  );
}
