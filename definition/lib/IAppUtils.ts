import { BlockBuilder } from "../../src/lib/BlockBuilder";
import { ElementBuilder } from "../../src/lib/ElementBuilder";
import { NotionSDK } from "../../src/lib/NotionSDK";

export interface IAppUtils {
    NotionSdk: NotionSDK;
    elementBuilder: ElementBuilder;
    blockBuilder: BlockBuilder;
}
