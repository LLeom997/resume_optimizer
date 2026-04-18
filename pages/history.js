export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/legacy/history.html",
      permanent: false,
    },
  };
}

export default function HistoryRedirect() {
  return null;
}
