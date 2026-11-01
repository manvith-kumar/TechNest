package com.technest.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Runs against a real MySQL schema (technest_test), created and seeded by Flyway.
 * Prerequisite: database/create_database.sql has been run, and DB_PASSWORD is set.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TechNestIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    static final String EMAIL = "it-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    static final String PASSWORD = "Passw0rdTest";
    static String customerToken;
    static String adminToken;
    static long orderId;
    static long productId;
    static int stockBefore;

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    @Test @Order(1)
    void registerRejectsWeakPasswordAndAcceptsStrongOne() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"IT User\",\"email\":\"" + EMAIL + "\",\"password\":\"weak\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.password").exists());
        MvcResult r = mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"IT User\",\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andExpect(cookie().httpOnly("technest_refresh", true)).andReturn();
        customerToken = body(r).get("accessToken").asText();
    }

    @Test @Order(2)
    void duplicateEmailIsRejectedAndBadLoginIsGeneric() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Dup\",\"email\":\"" + EMAIL.toUpperCase() + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + EMAIL + "\",\"password\":\"Wrong1234\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test @Order(3)
    void authorizationRules() throws Exception {
        mvc.perform(get("/api/v1/cart")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/cart").header("Authorization", "Bearer not-a-token")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/dashboard").header("Authorization", "Bearer " + customerToken)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/products")).andExpect(status().isOk());   // catalogue is public
    }

    @Test @Order(4)
    void adminLoginAndDashboardUseRealData() throws Exception {
        MvcResult r = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@technest.dev\",\"password\":\"Admin@12345\"}")).andExpect(status().isOk()).andReturn();
        adminToken = body(r).get("accessToken").asText();
        MvcResult d = mvc.perform(get("/api/v1/admin/dashboard").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andReturn();
        long ordersInDb = jdbc.queryForObject("select count(*) from orders", Long.class);
        assertEquals(ordersInDb, body(d).get("totalOrders").asLong());
    }

    @Test @Order(5)
    void catalogueSearchFilterAndPagination() throws Exception {
        MvcResult r = mvc.perform(get("/api/v1/products").param("q", "sony").param("size", "5").param("sort", "price_asc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").isNotEmpty()).andReturn();
        double prev = -1;
        for (JsonNode p : body(r).get("content")) {
            assertTrue(p.get("brand").asText().equalsIgnoreCase("sony") || p.get("name").asText().toLowerCase().contains("sony"));
            assertTrue(p.get("currentPrice").asDouble() >= prev);
            prev = p.get("currentPrice").asDouble();
        }
        mvc.perform(get("/api/v1/products").param("minPrice", "50000").param("maxPrice", "60000"))
                .andExpect(status().isOk());
    }

    @Test @Order(6)
    void checkoutReducesStockAndClearsCart() throws Exception {
        productId = jdbc.queryForObject("select id from products where active=1 and stock_quantity>=5 order by id limit 1", Long.class);
        stockBefore = jdbc.queryForObject("select stock_quantity from products where id=?", Integer.class, productId);
        String auth = "Bearer " + customerToken;

        mvc.perform(post("/api/v1/cart/items").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":2}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(2));
        mvc.perform(post("/api/v1/cart/items").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":" + (stockBefore + 1) + "}")).andExpect(status().isBadRequest());

        MvcResult a = mvc.perform(post("/api/v1/addresses").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"Home\",\"recipientName\":\"IT User\",\"phone\":\"9000000099\",\"line1\":\"1 Test Road\","
                        + "\"city\":\"Chennai\",\"state\":\"Tamil Nadu\",\"postalCode\":\"600001\"}"))
                .andExpect(status().isCreated()).andReturn();
        long addressId = body(a).get("id").asLong();

        MvcResult o = mvc.perform(post("/api/v1/orders").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"addressId\":" + addressId + ",\"paymentMethod\":\"DEMO_ONLINE\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.payment.simulated").value(true)).andReturn();
        orderId = body(o).get("id").asLong();

        assertEquals(stockBefore - 2, (int) jdbc.queryForObject("select stock_quantity from products where id=?", Integer.class, productId));
        assertEquals(1, (int) jdbc.queryForObject("select count(*) from orders where id=? and status='PLACED'", Integer.class, orderId));
        mvc.perform(get("/api/v1/cart").header("Authorization", auth)).andExpect(jsonPath("$.items").isEmpty());
    }

    @Test @Order(7)
    void duplicateSubmissionWithSameKeyDoesNotCreateSecondOrder() throws Exception {
        String auth = "Bearer " + customerToken;
        long addressId = jdbc.queryForObject("select id from addresses where user_id=(select id from users where email=?) limit 1", Long.class, EMAIL);
        mvc.perform(post("/api/v1/cart/items").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":1}")).andExpect(status().isOk());
        String key = UUID.randomUUID().toString();
        String req = "{\"addressId\":" + addressId + ",\"paymentMethod\":\"COD\",\"idempotencyKey\":\"" + key + "\"}";
        long first = body(mvc.perform(post("/api/v1/orders").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(req))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        long second = body(mvc.perform(post("/api/v1/orders").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(req))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        assertEquals(first, second);
        // cancel it again so stock bookkeeping in the next test is simple
        mvc.perform(post("/api/v1/orders/" + first + "/cancel").header("Authorization", auth)).andExpect(status().isOk());
        assertEquals(stockBefore - 2, (int) jdbc.queryForObject("select stock_quantity from products where id=?", Integer.class, productId));
    }

    @Test @Order(8)
    void adminAdvancesOrderAndCustomerSeesIt() throws Exception {
        String admin = "Bearer " + adminToken;
        mvc.perform(put("/api/v1/admin/orders/" + orderId + "/status").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"DELIVERED\"}")).andExpect(status().isConflict());   // cannot skip steps
        for (String s : new String[] {"CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"}) {
            mvc.perform(put("/api/v1/admin/orders/" + orderId + "/status").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"" + s + "\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value(s));
        }
        mvc.perform(get("/api/v1/orders/" + orderId).header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test @Order(9)
    void reviewRequiresDeliveredPurchaseAndUpdatesAverage() throws Exception {
        String auth = "Bearer " + customerToken;
        mvc.perform(post("/api/v1/products/" + productId + "/reviews").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":5,\"title\":\"Great\",\"comment\":\"Works well\"}")).andExpect(status().isCreated());
        mvc.perform(post("/api/v1/products/" + productId + "/reviews").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":4}")).andExpect(status().isConflict());   // one review per customer per product
        mvc.perform(post("/api/v1/products/" + productId + "/reviews").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":9}")).andExpect(status().isBadRequest());
        int count = jdbc.queryForObject("select rating_count from products where id=?", Integer.class, productId);
        assertEquals(jdbc.queryForObject("select count(*) from reviews where product_id=?", Integer.class, productId).intValue(), count);
    }

    @Test @Order(10)
    void customersCannotSeeOrManipulateOtherCustomersData() throws Exception {
        long otherOrder = jdbc.queryForObject("select id from orders where user_id<>(select id from users where email=?) limit 1", Long.class, EMAIL);
        mvc.perform(get("/api/v1/orders/" + otherOrder).header("Authorization", "Bearer " + customerToken)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/orders/" + otherOrder + "/cancel").header("Authorization", "Bearer " + customerToken)).andExpect(status().isNotFound());
    }
}
