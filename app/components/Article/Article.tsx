import Image from "next/image";
import styles from "./Article.module.scss";
import Typewriter from "../Typewriter";

type ArticleImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  priority?: boolean;
};

type ArticleProps = {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  image?: ArticleImage;
  children: React.ReactNode;
};

export default function Article({
  title,
  subtitle,
  author,
  date,
  image,
  children,
}: ArticleProps) {
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Typewriter text={title} speed={0.09} />
        </h1>

        {subtitle && (
          <h2 className={styles.subtitle}>
            {" "}
            <Typewriter text={subtitle} speed={0.05} />
          </h2>
        )}

        {(author || date) && (
          <div className={styles.meta}>
            {author && <span>By {author}</span>}
            {date && <span> — {date}</span>}
          </div>
        )}
      </header>

      {image && (
        <figure className={styles.figure}>
          <div className={styles.imgTxt}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              priority={image.priority}
              className={styles.image}
            />
            <p className={(styles.body, styles.p)}>
              Je suis développeur frontend spécialisé dans la création
              d'interfaces web modernes, performantes et intuitives. Mon travail
              consiste à transformer des idées, des designs et des besoins
              utilisateurs en expériences interactives accessibles directement
              dans le navigateur.
            </p>
          </div>

          {image.caption && (
            <figcaption className={styles.caption}>{image.caption}</figcaption>
          )}
        </figure>
      )}

      <div className={styles.body}>{children}</div>
    </article>
  );
}
