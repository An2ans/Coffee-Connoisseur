import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import styles from "../../styles/store.module.css";
import Image from "next/image";
import cls from "classnames";
import { fetchCoffeeStores } from "../../lib/coffee-stores";
import { useContext, useEffect, useState } from "react";
import { StoreContext } from "../../store/store-context";
import { isEmpty, fetcher } from "../../lib/utils";
import useSWR from "swr";

export async function getStaticProps(staticProps) {
  const params = staticProps.params;
  const coffeeStores = await fetchCoffeeStores();
  const findCoffeeStoreById = coffeeStores.find((store) => {
    return store.id.toString() === params.id;
  });
  return {
    props: {
      coffeeStore: findCoffeeStoreById ? findCoffeeStoreById : {},
    },
  };
}

export async function getStaticPaths() {
  const coffeeStores = await fetchCoffeeStores();
  const paths = coffeeStores.map((store) => {
    return {
      params: {
        id: store.id.toString(),
      },
    };
  });
  return {
    paths,
    fallback: true,
  };
}

const Store = (initialProps) => {
  const router = useRouter();
  const id = router.query.id;
  const [coffeeStore, setCoffeeStore] = useState(
    initialProps.coffeeStore || {}
  );
  const {
    state: { coffeeStores },
  } = useContext(StoreContext);

  const handleCreateCoffeeStore = async (coffeeStore) => {
    try {
      const { id, name, address, neighborhood, imgUrl, score } = coffeeStore;
      const response = await fetch("/api/createCoffeeStore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          address: address || "",
          neighborhood: neighborhood || "",
          imgUrl,
          score: 0,
        }),
      });
      const dbCoffeeStore = await response.json();
    } catch (error) {
      console.log("error creating coffee store", error);
    }
  };

  useEffect(() => {
    if (isEmpty(initialProps.coffeeStore)) {
      if (coffeeStores.length > 0) {
        const coffeeStoreFromContext = coffeeStores.find((store) => {
          return store.id.toString() === id;
        });
        if (coffeeStoreFromContext) {
          setCoffeeStore(coffeeStoreFromContext);
          handleCreateCoffeeStore(coffeeStoreFromContext);
        }
      }
    } else {
      //SSG//
      handleCreateCoffeeStore(initialProps.coffeeStore);
    }
  }, [id, initialProps, initialProps.coffeeStore, coffeeStores]);

  const { address, neighborhood, name, imgUrl } = coffeeStore;
  const [score, setScore] = useState(0);

  const { data, error } = useSWR(`/api/getCoffeeStoreById?id=${id}`, fetcher);

  useEffect(() => {
    if (data && data.length > 0) {
      setCoffeeStore(data[0]);

      setScore(data[0].score);
    }
  }, [data]);

  const handleUpvote = async () => {
    try {
      const response = await fetch("/api/voteCoffeeStoreById", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });
      const dbCoffeeStore = await response.json();
      if (dbCoffeeStore && dbCoffeeStore.length > 0) {
        let count = score + 1;
        setScore(count);
      }
    } catch (error) {
      console.log("error voting coffee store", error);
    }
  };

  if (error) {
    return <div>Something went wrong retrieving coffee store page</div>;
  }

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  console.log({ coffeeStore });

  return (
    <div className={styles.layout}>
      <Head>
        <title>{name}</title>
        <meta name="description" content={`${name} coffee store`}></meta>
      </Head>
      <div className={styles.container}>
        <div className={styles.col1}>
          <Link href="/" passHref>
            <div className={styles.backToHomeLink}>
              <a>&#8592; Back to home</a>
            </div>
          </Link>
          <div className={styles.nameWrapper}>
            <h1 className={styles.name}>{name}</h1>
          </div>
          <Image
            src={
              imgUrl ||
              "https://images.unsplash.com/photo-1498804103079-a6351b050096?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2468&q=80"
            }
            width={600}
            height={360}
            className={styles.storeImg}
            alt={name}
          />
        </div>
        <div className={cls(styles.col2, "glass")}>
          <div className={styles.iconWrapper}>
            <Image
              className={styles.icon}
              src={"/icons/places.svg"}
              width={24}
              height={24}
              alt={address}
            />
            <p className={styles.text}>{address}</p>
          </div>
          {neighborhood && (
            <div className={styles.iconWrapper}>
              <Image
                src={"/icons/nearMe.svg"}
                width={24}
                height={24}
                alt={neighborhood}
              />
              <p className={styles.text}>{neighborhood}</p>
            </div>
          )}
          <div className={styles.iconWrapper}>
            <Image src={"/icons/star.svg"} width={24} height={24} alt="score" />
            <p className={styles.text}>{score}</p>
          </div>
          <button className={styles.upvoteButton} onClick={handleUpvote}>
            Vote now!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Store;
