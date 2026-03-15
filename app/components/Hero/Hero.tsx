"use client";

import Article from "../Article/Article";
import Typewriter from "../Typewriter";
import styles from "./Hero.module.scss";
import Image from "next/image";

export default function Hero() {
  return (
    <section className={`${styles.hero} page-content`}>
      <div className={styles.profileContent}>
        <div className={styles.titleBloc}>
          <h1 className="headline">
            <Typewriter text="Maxime Leconte" />
          </h1>

          <h2 className="subtitle">
            <Typewriter text="Développeur Frontend" speed={0.04} />
          </h2>
        </div>

        <Article
          title="Penser, concevoir et développer des interfaces"
          subtitle="Entre technique, créativité et expérience utilisateur"
          author="Maxime Leconte"
          date="Aujourd'hui"
          image={{
            src: "/assets/me.png",
            alt: "Photo de Maxime Leconte",
            width: 300,
            height: 300,
            caption: "Maxime Leconte, développeur frontend.",
          }}>
          <p>
            Au fil de mes projets, j’ai développé une solide expertise dans les
            technologies du web moderne, notamment JavaScript, TypeScript,
            React, Next.js et Angular. J’accorde une attention particulière à la
            qualité du code, à la maintenabilité des applications et à la
            performance des interfaces.
          </p>
          {/* 
          <p>
            Pour moi, le développement frontend ne se limite pas à écrire du
            code : c’est un équilibre entre logique, design et storytelling.
            Chaque interface est une occasion de créer une expérience claire,
            élégante et agréable pour l’utilisateur.
          </p>

          <p>
            J’aime concevoir des projets qui allient rigueur technique et
            créativité, avec l’objectif de construire des produits numériques
            utiles, durables et bien pensés.
          </p> */}
        </Article>
      </div>
    </section>
  );
}
