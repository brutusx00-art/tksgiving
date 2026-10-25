export async function onRequestGet(context) {
    try {
        const { env } = context;
        // Retrieve dishes from KV
        const dishes = await env.POTLUCK_DISHES.get("dishes", { type: "json" });
        return Response.json(dishes || []);
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();

        if (!body.name || !body.dish || !body.category) {
            return Response.json({ error: "Name, dish, and category are required" }, { status: 400 });
        }

        // Get existing dishes
        let dishes = await env.POTLUCK_DISHES.get("dishes", { type: "json" });
        if (!dishes) dishes = [];

        // Add new dish
        const newDish = {
            id: Date.now(),
            name: body.name,
            dish: body.dish,
            category: body.category,
            timestamp: new Date().toISOString()
        };
        dishes.push(newDish);

        // Save back to KV
        await env.POTLUCK_DISHES.put("dishes", JSON.stringify(dishes));

        return Response.json(newDish, { status: 201 });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function onRequestDelete(context) {
    try {
        const { request, env, params } = context;
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return Response.json({ error: "Invalid dish ID" }, { status: 400 });
        }

        // Get existing dishes
        let dishes = await env.POTLUCK_DISHES.get("dishes", { type: "json" });
        if (!dishes) {
            return Response.json({ error: "Dish not found" }, { status: 404 });
        }

        const index = dishes.findIndex(d => d.id === id);
        if (index === -1) {
            return Response.json({ error: "Dish not found" }, { status: 404 });
        }

        dishes.splice(index, 1);

        // Save back to KV
        await env.POTLUCK_DISHES.put("dishes", JSON.stringify(dishes));

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}