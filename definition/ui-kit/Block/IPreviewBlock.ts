import { PreviewBlockWithThumb } from "@rocket.chat/ui-kit";

export type PreviewBlockParam = Partial<
    Pick<PreviewBlockWithThumb, "footer" | "thumb">
> & {
    title: Array<string>;
    description: Array<string>;
};
