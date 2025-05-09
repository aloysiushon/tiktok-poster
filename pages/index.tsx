import Template from "@/templates";

const TestPage = () => {
  const testQuote = {
    title: "Inspiration",
    quote: "The best way to predict the future is to create it.",
    background: "",
  };
  return <Template quote={testQuote} />;
};

export default TestPage;
