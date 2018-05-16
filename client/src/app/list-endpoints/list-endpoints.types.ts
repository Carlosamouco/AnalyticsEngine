export interface Endpoint {
  _id?: string;
  url: string;
  description: string;
  parameters: EndpointParam[];
}

export interface EndpointParam {
  key: string;
  description?: string;
}
