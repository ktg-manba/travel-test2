import { getTranslations } from "next-intl/server";
import Pricing from "@/components/blocks/pricing";
import { Pricing as PricingType } from "@/types/blocks/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("travel.products.title"),
    description: t("travel.products.description"),
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const pricing: PricingType = {
    name: "products",
    title: t("travel.products.title"),
    description: t("travel.products.description"),
    groups: [],
    items: [
      {
        title: t("travel.products.pdf_bundle.title"),
        description: t("travel.products.pdf_bundle.description"),
        features_title: t("travel.products.includes"),
        features: [
          t("travel.products.pdf_bundle.feature1"),
          t("travel.products.pdf_bundle.feature2"),
        ],
        interval: "one-time",
        amount: 2900, // $29 in cents
        cn_amount: 19900, // ¥199 in cents
        currency: "USD",
        price: t("travel.products.pdf_bundle.price"),
        unit: "",
        is_featured: false,
        tip: t("travel.products.pdf_bundle.tip"),
        button: {
          title: t("travel.products.pdf_bundle.buy"),
          url: "/#pricing",
          icon: "RiShoppingCartLine",
        },
        product_id: "pdf_bundle",
        product_name: t("travel.products.pdf_bundle.title"),
        credits: 0,
        valid_months: 12,
      },
      {
        title: t("travel.products.chatbot_access.title"),
        description: t("travel.products.chatbot_access.description"),
        features_title: t("travel.products.includes"),
        features: [
          t("travel.products.chatbot_access.feature1"),
          t("travel.products.chatbot_access.feature2"),
          t("travel.products.chatbot_access.feature3"),
        ],
        interval: "month",
        amount: 1900, // $19 in cents
        cn_amount: 12900, // ¥129 in cents
        currency: "USD",
        price: t("travel.products.chatbot_access.price"),
        unit: "/month",
        is_featured: true,
        tip: t("travel.products.chatbot_access.tip"),
        button: {
          title: t("travel.products.chatbot_access.buy"),
          url: "/#pricing",
          icon: "RiRobotLine",
        },
        product_id: "chatbot_access",
        product_name: t("travel.products.chatbot_access.title"),
        credits: 0,
        valid_months: 1,
      },
      {
        title: t("travel.products.premium.title"),
        description: t("travel.products.premium.description"),
        features_title: t("travel.products.includes"),
        features: [
          t("travel.products.premium.feature1"),
          t("travel.products.premium.feature2"),
          t("travel.products.premium.feature3"),
        ],
        interval: "one-time",
        amount: 3900, // $39 in cents
        cn_amount: 29900, // ¥299 in cents
        currency: "USD",
        price: t("travel.products.premium.price"),
        unit: "",
        is_featured: false,
        tip: t("travel.products.premium.tip"),
        button: {
          title: t("travel.products.premium.buy"),
          url: "/#pricing",
          icon: "RiStarLine",
        },
        product_id: "premium",
        product_name: t("travel.products.premium.title"),
        credits: 0,
        valid_months: 12,
      },
    ],
  };

  return (
    <div className="container py-16">
      <div className="mx-auto mb-12 text-center">
        <h1 className="mb-4 text-4xl font-semibold lg:text-5xl">
          {t("travel.products.title")}
        </h1>
        <p className="text-muted-foreground lg:text-lg">
          {t("travel.products.description")}
        </p>
      </div>
      <Pricing pricing={pricing} />
    </div>
  );
}


