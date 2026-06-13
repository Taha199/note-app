import type { Timestamp } from "firebase/firestore";

export type NoteStyle = {
  color: string;
  fontFamily: string;
  fontSize: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
};

export type Note = {
  id: string;
  title: string;
  content: string;
  style?: Partial<NoteStyle>;
  archived?: boolean;
  favorite?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  archivedAt?: Timestamp;
};
