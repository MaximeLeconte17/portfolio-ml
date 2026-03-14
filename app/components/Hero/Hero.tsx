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
        {/* <Image
          src="/assets/me.png"
          alt="photo de profil"
          width={300}
          height={300}
          className={styles.profile}
        /> */}

        <Article
          title="The Rise of the Web Artisan"
          subtitle="How creativity returned to development"
          author="A. Developer"
          date="March 1926"
          image={{
            src: "/assets/me.png",
            alt: "Developer portrait",
            width: 300,
            height: 300,
            caption: "A developer at work in the early morning.",
          }}>
          <p>
            In the early days of the web, crafting a website was closer to an
            artisan's trade than to industrial production.
          </p>

          <p>
            Developers experimented freely, mixing typography, layout and
            storytelling to create unique digital experiences.
          </p>

          <p>
            Today a new generation is rediscovering this philosophy and bringing
            narrative design back into modern interfaces.
          </p>
        </Article>
      </div>
    </section>
  );
}
