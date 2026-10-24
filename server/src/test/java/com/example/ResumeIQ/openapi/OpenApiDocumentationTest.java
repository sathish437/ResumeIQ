package com.example.ResumeIQ.openapi;

import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that the generated OpenAPI document advertises the upload and ask
 * endpoints with the right request shapes and the documented responses.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiDocumentationTest {

    private static final String UPLOAD_ENDPOINT = "/api/resumes/upload";
    private static final String ASK_ENDPOINT = "/api/resumes/ask";
    private static final String MULTIPART = "multipart/form-data";
    private static final String JSON = "application/json";

    @Autowired
    private MockMvc mockMvc;

    private DocumentContext apiDocs;

    @BeforeEach
    void loadApiDocs() throws Exception {
        String body = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        apiDocs = JsonPath.parse(body);
    }

    @Test
    void exposesUploadAsMultipartPost() {
        Map<String, Object> content = apiDocs.read(
                "$.paths['" + UPLOAD_ENDPOINT + "'].post.requestBody.content");
        assertThat(content).containsKey(MULTIPART);

        Boolean requestBodyRequired = apiDocs.read(
                "$.paths['" + UPLOAD_ENDPOINT + "'].post.requestBody.required");
        assertThat(requestBodyRequired).isTrue();
    }

    @Test
    void documentsTheResumeUploadAsARequiredBinaryUpload() {
        Map<String, Object> schema = readSchema(UPLOAD_ENDPOINT, MULTIPART);

        assertThat(asStringList(schema.get("required"))).containsExactly("resume");

        Map<String, Object> properties = asMap(schema.get("properties"));
        assertThat(properties).containsKeys("resume");
        assertBinaryUpload(properties.get("resume"));
    }

    @Test
    void exposesAskAsJsonPost() {
        Map<String, Object> content = apiDocs.read(
                "$.paths['" + ASK_ENDPOINT + "'].post.requestBody.content");
        assertThat(content).containsKey(JSON);

        Boolean requestBodyRequired = apiDocs.read(
                "$.paths['" + ASK_ENDPOINT + "'].post.requestBody.required");
        assertThat(requestBodyRequired).isTrue();
    }

    @Test
    void documentsQuestionAsTheOnlyRequestBodyField() {
        Map<String, Object> schema = readSchema(ASK_ENDPOINT, JSON);

        assertThat(asStringList(schema.get("required")))
                .containsExactly("question");

        Map<String, Object> properties = asMap(schema.get("properties"));
        assertThat(properties).containsOnlyKeys("question");
        assertTextField(properties.get("question"));
    }

    @Test
    void documentsUploadResponses() {
        for (String code : List.of("200", "400", "413", "422", "500")) {
            Map<String, Object> response = apiDocs.read(
                    "$.paths['" + UPLOAD_ENDPOINT + "'].post.responses['" + code + "']");
            assertThat(response)
                    .as("upload response %s is documented", code)
                    .isNotNull();
        }
    }

    @Test
    void documentsAskResponses() {
        for (String code : List.of("200", "400", "404", "502", "500")) {
            Map<String, Object> response = apiDocs.read(
                    "$.paths['" + ASK_ENDPOINT + "'].post.responses['" + code + "']");
            assertThat(response)
                    .as("ask response %s is documented", code)
                    .isNotNull();
        }
    }

    @Test
    void documentsAnalyzeResponses() {
        String analyzeEndpoint = "/api/resumes/analyze";
        for (String code : List.of("200", "404", "502", "500")) {
            Map<String, Object> response = apiDocs.read(
                    "$.paths['" + analyzeEndpoint + "'].post.responses['" + code + "']");
            assertThat(response)
                    .as("analyze response %s is documented", code)
                    .isNotNull();
        }
    }

    @Test
    void documentsSkillGapResponses() {
        String skillGapEndpoint = "/api/resumes/skill-gap";
        for (String code : List.of("200", "400", "404", "502", "500")) {
            Map<String, Object> response = apiDocs.read(
                    "$.paths['" + skillGapEndpoint + "'].post.responses['" + code + "']");
            assertThat(response)
                    .as("skill-gap response %s is documented", code)
                    .isNotNull();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readSchema(String endpoint, String mediaType) {
        Map<String, Object> schema = apiDocs.read(
                "$.paths['" + endpoint + "'].post.requestBody.content['" + mediaType + "'].schema");
        Object ref = schema.get("$ref");
        if (ref instanceof String refValue) {
            String pointer = refValue.startsWith("#") ? refValue.substring(1) : refValue;
            StringBuilder path = new StringBuilder("$");
            for (String segment : pointer.split("/")) {
                if (!segment.isBlank()) {
                    path.append("['").append(segment).append("']");
                }
            }
            schema = apiDocs.read(path.toString());
        }
        return schema;
    }

    @SuppressWarnings("unchecked")
    private static void assertBinaryUpload(Object propertySchema) {
        Map<String, Object> property = asMap(propertySchema);
        assertThat(property.get("type")).isEqualTo("string");
        assertThat(property.get("format")).isEqualTo("binary");
    }

    @SuppressWarnings("unchecked")
    private static void assertTextField(Object propertySchema) {
        Map<String, Object> property = asMap(propertySchema);
        assertThat(property.get("type")).isEqualTo("string");
        assertThat(property.get("format"))
                .as("field is a text value, not a file upload")
                .isNotEqualTo("binary");
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        assertThat(value).isInstanceOf(Map.class);
        return (Map<String, Object>) value;
    }

    private static List<String> asStringList(Object value) {
        assertThat(value).isInstanceOf(List.class);
        return ((List<?>) value).stream().map(String::valueOf).toList();
    }
}
