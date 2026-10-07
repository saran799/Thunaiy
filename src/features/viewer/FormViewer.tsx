import FormPageFrame from './FormPageFrame';
import { artworkRegistry } from './artwork';
import type { FormDocument } from './types';

/** Generic viewer: renders any FormDocument. Bank/form specific artwork is looked up from the registry. */
export default function FormViewer({ document, zoom }: { document: FormDocument; zoom: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-[24px]">
      {document.pages.map((page) => {
        const Artwork = artworkRegistry[page.artwork];
        return (
          <FormPageFrame key={page.page} page={page} fields={document.fields} zoom={zoom}>
            {Artwork ? <Artwork fields={document.fields} /> : null}
          </FormPageFrame>
        );
      })}
    </div>
  );
}
