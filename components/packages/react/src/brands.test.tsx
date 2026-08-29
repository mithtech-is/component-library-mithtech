import { render, screen } from "@testing-library/react";
import { BrandLogo, BRAND_SLUGS, MedusaLogo, ErpNextLogo, FrappeLogo } from "./index";

describe("brand logos", () => {
  it("renders each mark as a labelled svg addressable by name", () => {
    render(<BrandLogo name="medusa" />);
    const mark = screen.getByRole("img", { name: "Medusa" });
    expect(mark.tagName.toLowerCase()).toBe("svg");
    expect(mark.querySelector("path")).not.toBeNull();
  });

  it("follows currentColor by default and takes a resting ink", () => {
    const { rerender } = render(<MedusaLogo />);
    expect(screen.getByRole("img", { name: "Medusa" })).toHaveAttribute("fill", "currentColor");
    rerender(<MedusaLogo mono color="#6C4CFF" />);
    // `mono` wins over an explicit colour — a single ink that tracks the theme.
    expect(screen.getByRole("img", { name: "Medusa" })).toHaveAttribute("fill", "currentColor");
    rerender(<MedusaLogo color="#6C4CFF" />);
    expect(screen.getByRole("img", { name: "Medusa" })).toHaveAttribute("fill", "#6C4CFF");
  });

  it("exposes every manifest slug through the resolver map", () => {
    // The three marks the library owns, then the eighteen platform marks
    // SocialButton draws — vendored here rather than in the component, because
    // a component drawing its own glyph is a second glyph set to keep current.
    expect([...BRAND_SLUGS]).toEqual([
      "medusa", "erpnext", "frappe",
      "x", "linkedin", "github", "gitlab", "youtube", "instagram", "facebook", "threads",
      "whatsapp", "telegram", "discord", "slack", "mastodon", "bluesky", "medium",
      "dribbble", "behance", "reddit",
    ]);
    render(<><ErpNextLogo /><FrappeLogo /></>);
    expect(screen.getByRole("img", { name: "ERPNext" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Frappe" })).toBeInTheDocument();
  });

  it("renders nothing for an unknown name rather than throwing", () => {
    // @ts-expect-error — the resolver guards a slug that is not in the set.
    const { container } = render(<BrandLogo name="not-a-brand" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
