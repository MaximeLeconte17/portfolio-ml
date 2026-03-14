import Image from "next/image";
import styles from "./About.module.scss";

export default function About() {
  return (
    <section className={`${styles.about} page-content`}>
      <Image
        src="/assets/finger.png"
        alt="doigt"
        width={50}
        height={50}
        className={styles.finger}
      />
    </section>
  );
}
