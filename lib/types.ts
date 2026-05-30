export interface ISettings {
  _id?: string;
  email: string;
  handle: string;
  githubUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  behanceUrl?: string;
  updatedAt?: string | Date;
}

export interface IProject {
  _id: string;
  title: string;
  liveUrl?: string;
  githubUrl?: string;
  mobileImage?: string;
  desktopImage?: string;
  featured: boolean;
  createdAt: string | Date;
}
