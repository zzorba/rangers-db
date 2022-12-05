import Router from "next/router";
import { useEffect } from "react";
import LoadingPage from "../../../components/LoadingPage";

export default function ViewIndex() {
  useEffect(() => {
    Router.replace('/decks');
  }, []);
  return <LoadingPage />;
}