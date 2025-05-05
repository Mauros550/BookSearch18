export interface GoogleAPIVolumeInfo {
  title: string;
  authors: string[];
  description: string;
  imageLinks: {
    smallThumbnail: string;
    thumbnail: string;
  };
  infoLink?: string ;
  previewLink?: string;
}

export interface GoogleAPIBook {
    id: string;
    volumeInfo: GoogleAPIVolumeInfo;
}
