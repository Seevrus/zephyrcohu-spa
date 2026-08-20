export type LinkResponse = {
  id: number;
  title: string;
  url: string;
  category: string;
};

export type LinksCollectionResponse = {
  data: LinkResponse[];
};
