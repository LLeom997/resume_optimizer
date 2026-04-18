export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/legacy/resumes.html",
      permanent: false,
    },
  };
}

export default function ResumesRedirect() {
  return null;
}
