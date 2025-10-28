import { Timestamp } from "firebase/firestore";

export interface MessageItem {
  id: string;
  email: string;
  content: string;
  createdAt?: Timestamp;
  deleted?: boolean;
  deletedAt?: Timestamp;
  read?: boolean;
  starred?: boolean;
}
