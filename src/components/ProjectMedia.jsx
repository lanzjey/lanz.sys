// Project image, or a drawn placeholder window when no image has been added yet.
export default function ProjectMedia({ project, index = 0 }) {
  if (project.media) return <div className="project-media"><img src={project.media} alt="" loading="lazy" /></div>;
  return <div className={`project-media is-placeholder tone-${index % 3}`} aria-hidden="true">
    <span className="pm-window"><span className="pm-bar"><i /><i /><i /></span><span className="pm-body"><span className="pm-side" /><span className="pm-map"><i /><i /><i /></span></span></span>
  </div>;
}
