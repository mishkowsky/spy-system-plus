import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useTranslation } from "@/hooks/use-translation";

export default function Index() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      {/* Hero Section - Centered Vertically */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            {t("hero.system")}
            <span className="text-primary"> Spy+</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {t("hero.tracksHabits")}
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              {/*<Link to="/login">*/}
              {/*   <Button*/}
              {/*     variant="outline"*/}
              {/*     size="lg"*/}
              {/*     className="w-full sm:w-auto"*/}
              {/*   >*/}
              {/*     {t("auth.signIn")}*/}
              {/*   </Button>*/}
              {/* </Link>*/}
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  {t("auth.register")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
