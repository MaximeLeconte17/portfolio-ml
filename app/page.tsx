import Book from "./components/Book/Book";
import Hero from "./components/Hero/Hero";
import About from "./components/About/About";
import Projects from "./components/Projects/Projects";

type PageDef = { id: string; title?: string; content: React.ReactNode };

export default function HomePage() {
  const pages: PageDef[] = [
    { id: "hero", title: "UNE", content: <Hero /> },
    { id: "about", title: "À propos", content: <About /> },
    { id: "projects", title: "Projets", content: <Projects /> },
    { id: "projects2", title: "Projets", content: <Projects /> },
    { id: "projects3", title: "Projets", content: <Projects /> },
    { id: "projects4", title: "Projets", content: <Projects /> },
  ];

  return (
    <main className="page-root">
      <Book pages={pages} width={900} height={650} />
    </main>
  );
}