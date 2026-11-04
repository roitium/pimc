import Card from "@/components/Card";
import PageTitle from "@/components/PageTitle";

export interface ProjectCard {
  title: string;
  description: string;
  href?: string;
  imgSrc?: string;
}

export default function Projects({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="lg:mx-auto lg:max-w-(--breakpoint-lg)">
      <div className="min-w-full">
        <PageTitle title="Projects" subtitle="Just for fun." />
        <div className="container pt-2">
          <div className="-m-4 flex flex-wrap">
            {projects.map((d) => (
              <Card
                key={d.title}
                title={d.title}
                description={d.description}
                imgSrc={d.imgSrc}
                href={d.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
