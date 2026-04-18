export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/legacy/index.html",
      permanent: false,
    },
  };
}

export default function HomeRedirect() {
  return null;
}
