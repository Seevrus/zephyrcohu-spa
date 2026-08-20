export const OFFER_REQUEST_SUBJECT_OPTIONS = [
  {
    slug: "integra-new-client-general",
    label: "Zephyr INTEGRA - új ügyfél, cégügyvitel",
  },
  {
    slug: "integra-new-client-accounting-firm",
    label: "Zephyr INTEGRA - új ügyfél, könyvelő iroda",
  },
  {
    slug: "integra-new-client-invoicing-only",
    label: "Zephyr INTEGRA - új ügyfél, csak számlázó program",
  },
  {
    slug: "integra-new-client-payroll-only",
    label: "Zephyr INTEGRA - új ügyfél, csak bér- és munkaügy",
  },
  {
    slug: "integra-new-client-other",
    label: "Zephyr INTEGRA - új ügyfél, egyéb felhasználási cél",
  },
  {
    slug: "integra-existing-client-subsystems",
    label: "Zephyr INTEGRA - meglévő ügyfél, kiegészítés alrendszerekkel",
  },
  {
    slug: "integra-existing-client-custom-dev",
    label: "Zephyr INTEGRA - meglévő ügyfél, egyedi fejlesztés",
  },
  {
    slug: "integra-existing-client-other",
    label: "Zephyr INTEGRA - meglévő ügyfél, egyéb feladatok",
  },
  { slug: "integra-software-rental", label: "Zephyr INTEGRA - szoftverbérlet" },
  {
    slug: "integra-flat-rate-remote",
    label: "Zephyr INTEGRA - átalánydíjas távoli használat",
  },
  {
    slug: "flat-rate-onsite-support",
    label: "Átalánydíjas helyszíni fejlesztői támogatás",
  },
  {
    slug: "flat-rate-remote-access",
    label: "Átalánydíjas távoli elérési szolgáltatás",
  },
  {
    slug: "task-os-maintenance",
    label: "Munkaigénylés: operációs rendszer karbantartása (Windows)",
  },
  {
    slug: "task-other-updates",
    label: "Munkaigénylés: egyéb frissítések (ÁNYK, Java, stb.)",
  },
  {
    slug: "task-device-maintenance",
    label: "Munkaigénylés: eszközkarbantartás (számítógépek, nyomtatók, stb.)",
  },
  {
    slug: "task-network-management",
    label: "Munkaigénylés: számítógéphálózat-kezelés, -hálózatépítés",
  },
  { slug: "task-virus-issues", label: "Munkaigénylés: vírus-problémák" },
  {
    slug: "task-integra-database",
    label: "Munkaigénylés: Zephyr INTEGRA adatbázis-feladatok",
  },
  {
    slug: "task-integra-settings",
    label: "Munkaigénylés: Zephyr INTEGRA beállítások, testreszabás, szervezés",
  },
  {
    slug: "task-integra-dev-ideas",
    label: "Munkaigénylés: Zephyr INTEGRA fejlesztési ötletek, hibajelzések",
  },
  { slug: "task-other", label: "Munkaigénylés: egyéb" },
  {
    slug: "nod32-antivirus",
    label: "NOD32 antivírus-megoldások (új licenc, hosszabbítás, stb.)",
  },
  {
    slug: "device-purchase",
    label: "Eszközvásárlás (számítógép, periféria, tartozék, kellékanyag)",
  },
  { slug: "other", label: "Egyéb (a fentiekhez nem sorolható)" },
] as const;

type OfferRequestSubjectSlug =
  (typeof OFFER_REQUEST_SUBJECT_OPTIONS)[number]["slug"];

export type RequestOfferRequest = {
  name: string;
  email: string;
  subject: OfferRequestSubjectSlug | "";
  message: string;
};
