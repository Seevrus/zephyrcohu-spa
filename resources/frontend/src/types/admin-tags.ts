export type AdminTagResponse = {
  id: number;
  name: string;
  count: number;
};

export type AdminTagCollectionResponse = { data: AdminTagResponse[] };
export type AdminTagItemResponse = { data: AdminTagResponse };

export type SaveAdminTagRequest = {
  name: string;
};
