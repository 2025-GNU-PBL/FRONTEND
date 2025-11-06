export type Product = {
  id: number;
  name: string;
  starCount: number;
  address: string;
  detail: string;
  price: number;
  availableTime: string;
  createdAt: string;
  thumbnail: string | null;
  region: string;
  ownerName: string;
  tags: {
    id: number;
    tagName: string;
  }[];
};

// export type makeupProduct = {
//   id: number;
//   name: string;
//   style: string;
//   starCount: number;
//   address: string;
//   detail: string;
//   price: number;
//   type: string;
//   availableTime: string;
//   createdAt: string;
//   thumbnail: string | null;
// };
