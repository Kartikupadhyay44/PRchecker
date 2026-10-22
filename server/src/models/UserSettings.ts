import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: string;
  githubUsername: string;
  preferredEmail: string;
  theme: 'light' | 'dark' | 'system';
  customOpenAiKey?: string;
  customGithubToken?: string;
  customResendKey?: string;
  autoSendEmail: boolean;
  includeDiffsInReport: boolean;
}

const UserSettingsSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    githubUsername: { type: String, default: '' },
    preferredEmail: { type: String, default: '' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    customOpenAiKey: { type: String, default: '' },
    customGithubToken: { type: String, default: '' },
    customResendKey: { type: String, default: '' },
    autoSendEmail: { type: Boolean, default: false },
    includeDiffsInReport: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserSettingsModel = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
