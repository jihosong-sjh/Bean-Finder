import type { TastingNoteGroup } from '../beans/bean.types';

export type TastingNote = {
  key: string;
  label_ko: string;
  label_en: string;
  group: TastingNoteGroup;
  aliases: string[];
  easy_tag: string | null;
};
