export interface Endpoint {
  _id?: string;
  url: string;
  method: string;
  description: string;
  parameters: EndpointParam[];
}

export interface EndpointParam {
  name: string;
  description?: string;
}
