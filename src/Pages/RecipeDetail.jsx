import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getById, searchYouTubeVideos } from "../Utils/Recipes";

function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState("");
  const fallbackImage =
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80";

  const toPlainText = (value) => {
    if (!value) return "";
    if (typeof window !== "undefined" && window.DOMParser) {
      const doc = new DOMParser().parseFromString(value, "text/html");
      return doc.body.textContent || "";
    }
    return value.replace(/<[^>]*>/g, "");
  };

  const getInstructionSteps = (value) => {
    const plainText = toPlainText(value)
      .replace(/\r/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!plainText) return [];

    const numberedSteps = plainText
      .split(/\s*(?=\d+[.)]\s+)/)
      .map((step) => step.replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean);

    if (numberedSteps.length > 1) return numberedSteps;

    return plainText
      .split(/(?:\.\s+|\n+)/)
      .map((step) => step.trim())
      .filter((step) => step.length > 8)
      .map((step) => (step.endsWith(".") ? step : `${step}.`));
  };

  const getIngredientLabel = (item) => {
    const name = item?.ingredient?.name || item?.name || "";
    const quantity = item?.quantity || item?.amount || "";
    return [quantity, name].filter(Boolean).join(" ").trim();
  };

  const getCookingTip = (item) => {
    const title = `${item?.title ?? ""} ${item?.category ?? ""}`.toLowerCase();
    const ingredientText = Array.isArray(item?.ingredients)
      ? item.ingredients.map(getIngredientLabel).join(" ").toLowerCase()
      : "";

    if (title.includes("jollof")) {
      return "Fry the tomato and pepper base until it reduces well before adding rice. That gives jollof rice a deeper taste.";
    }

    if (title.includes("beans") || ingredientText.includes("beans")) {
      return "Cook beans until soft before adding seasoning or sauce, so the final dish is tender and not undercooked.";
    }

    if (title.includes("plantain") || ingredientText.includes("plantain")) {
      return "Use ripe plantain for sweetness and avoid overcrowding the pan when frying.";
    }

    if (title.includes("soup") || ingredientText.includes("leaf")) {
      return "Add leafy vegetables near the end of cooking so they keep their color and fresh taste.";
    }

    return "Prepare and measure ingredients before heating the pot. It makes the cooking process faster and easier to follow.";
  };

  useEffect(() => {
    const getRecipe = async () => {
      try {
        const data = await getById(id);
        setRecipe(data);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    getRecipe();
  }, [id]);

  useEffect(() => {
    if (!recipe?.title) return;

    const controller = new AbortController();
    const getVideos = async () => {
      setVideosLoading(true);
      setVideosError("");

      try {
        const data = await searchYouTubeVideos(recipe.title, 4, {
          signal: controller.signal,
        });
        setVideos(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setVideos([]);
          setVideosError(error.message || "Video suggestions are unavailable right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setVideosLoading(false);
        }
      }
    };

    getVideos();

    return () => controller.abort();
  }, [recipe?.title]);

  if (loading) {
    return (
      <section className="page-container">
        <div className="spinner" aria-label="Loading recipe" />
      </section>
    );
  }

  if (!recipe) {
    return (
      <section className="page-container">
        <div className="empty-state">Recipe not found.</div>
      </section>
    );
  }

  const instructionSteps = getInstructionSteps(recipe.instructions);
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(getIngredientLabel).filter(Boolean)
    : [];
  const cookingTip = getCookingTip(recipe);

  return (
    <section className="page-container">
      <Link to="/" className="back-link">
        Back to recipes
      </Link>

      <article className="detail-card">
        <img
          src={recipe.imageUrl || fallbackImage}
          alt={recipe.title}
          className="detail-image"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />

        <div className="detail-content">
          <p className="eyebrow">Recipe Details</p>
          <h2>{recipe.title}</h2>

          {recipe.summary && <p className="detail-summary">{toPlainText(recipe.summary)}</p>}

          <div className="detail-meta">
            {recipe.category && <span>{recipe.category}</span>}
            {recipe.readyInMinutes > 0 && <span>{recipe.readyInMinutes} mins</span>}
            {recipe.servings > 0 && <span>{recipe.servings} servings</span>}
          </div>

          <div className="cooking-guide">
            <div className="guide-panel">
              <h3>Ingredients Needed</h3>
              {ingredients.length > 0 ? (
                <ul className="ingredient-list">
                  {ingredients.map((ingredient, index) => (
                    <li key={`${ingredient}-${index}`}>{ingredient}</li>
                  ))}
                </ul>
              ) : (
                <p className="guide-empty">No ingredient list available for this recipe.</p>
              )}
            </div>

            <div className="guide-panel">
              <h3>How to Cook</h3>
              {instructionSteps.length > 0 ? (
                <ol className="step-list">
                  {instructionSteps.map((step, index) => (
                    <li key={`${step}-${index}`}>
                      <span>Step {index + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="guide-empty">No cooking steps available for this recipe yet.</p>
              )}
            </div>
          </div>

          <div className="cook-tip">
            <strong>Cooking tip</strong>
            <p>{cookingTip}</p>
          </div>

          <section className="video-section">
            <div className="video-section-header">
              <div>
                <p className="eyebrow video-eyebrow">Watch and learn</p>
                <h3>Related cooking videos</h3>
              </div>
            </div>

            {videosLoading ? (
              <p className="video-status">Loading videos...</p>
            ) : videosError ? (
              <p className="video-status">{videosError}</p>
            ) : videos.length > 0 ? (
              <div className="video-grid">
                {videos.map((video) => (
                  <a
                    key={video.videoId}
                    href={video.watchUrl}
                    className="video-card"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={video.thumbnailUrl || fallbackImage}
                      alt={video.title}
                      onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                      }}
                    />
                    <div>
                      <h4>{video.title}</h4>
                      {video.channelTitle && <p>{video.channelTitle}</p>}
                      <span>Watch on YouTube</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="video-status">No related videos found for this recipe yet.</p>
            )}
          </section>
        </div>
      </article>
    </section>
  );
}

export default RecipeDetail;
