import { Metadata } from "next";
import Page from './page';

export const metadata = {
  title: "OQUE | Dashboard",
  description: "OQUE | Dashboard",
};

export default function PageLayout() {
  return (<Page />);
}
