import axios from "axios";
import supabase from "../config/supabase.js";

export function groupBy(arr, keySelector) {
  const map = {};

  arr.map((element) => {
    const key = keySelector(element);
    if (key === undefined) throw "undefined key!";

    map[key] = map[key] || [];
    map[key].push(element);
  });

  return map;
}

export async function gamesLookup() {
  let { data: wishlists, error } = await supabase.from("wishlists").select("*");

  if (error) {
    throw new Error(error.message);
  }

  const steamIDs = wishlists.map((game) => game.steam_id);
  const uniqueGameIDs = Array.from(new Set(steamIDs));

  const betterDeals = [];

  for (let i = 0; i < uniqueGameIDs.length; i++) {
    const response = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${uniqueGameIDs[i]}`
    );

    const title = response.data[`${uniqueGameIDs[i]}`].data.name;

    const parsedTitle = title.replace(/\W/g, "").toUpperCase();

    const dealsResponse = await axios.get(
      `https://www.cheapshark.com/api/1.0/deals?title=${parsedTitle}`
    );

    const deals = dealsResponse.data;

    if (deals.length === 0) continue;

    const filteredDeals = deals.filter(
      (deal) => deal.internalName === parsedTitle
    );

    const lowestPrice = Math.min(
      ...filteredDeals.map((deal) => parseFloat(deal.salePrice))
    );

    const bestDeal = filteredDeals.find(
      (deal) => parseFloat(deal.salePrice) === lowestPrice
    );

    let { data, error } = await supabase
      .from("wishlists")
      .select("price")
      .eq("steam_id", uniqueGameIDs[i])
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (parseFloat(data.price) > parseFloat(bestDeal.salePrice))
      betterDeals.push({ title: bestDeal.title, ...bestDeal });
  }

  return betterDeals;
}
