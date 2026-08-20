import {
  type LinkResponse,
  type LinksCollectionResponse,
} from "../../types/links";

export function createGetLinksOkResponse(
  links: LinkResponse[] = defaultLinks,
): LinksCollectionResponse {
  return { data: links };
}

const defaultLinks: LinkResponse[] = [
  {
    id: 3,
    title: "GitHub",
    url: "https://github.com",
    category: "Community",
  },
  {
    id: 1,
    title: "Stack Overflow",
    url: "https://stackoverflow.com",
    category: "Community",
  },
  {
    id: 4,
    title: "Laravel Documentation",
    url: "https://laravel.com/docs",
    category: "Documentation",
  },
  {
    id: 2,
    title: "PHP Manual",
    url: "https://www.php.net/manual/en/",
    category: "Documentation",
  },
];
