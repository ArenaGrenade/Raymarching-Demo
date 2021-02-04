export const vertexShader = `
    attribute vec3 position;

    void main(void) {
        gl_Position = vec4(position, 1.0);
    }
`;

// SDFs at http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

export const fragmentShader = `
    #define MAX_STEPS 100
    #define MAX_DIST 100.0
    #define SURF_DIST 0.001
    #define PI 3.142

    precision highp float;

    uniform vec2 resolution;
    uniform vec2 viewportSize;
    uniform float time;
    uniform float power;
    uniform mat4 invTransformMat;

    float atan2(in float y, in float x)
    {
        return x == 0.0 ? sign(y) * PI / 2.0 : atan(y, x);
    }

    float signedDistToSphere(vec3 p, vec4 sphere) {
        return length(sphere.xyz - p) - sphere.w;
    }

    float signedDistToBox(vec3 p, vec3 center, vec3 size) {
        vec3 offset = abs(p - center) - size;
        float unsignedDist = length(max(offset, 0.0));
        float distInsideBox = min(max(offset.x, max(offset.y, offset.z)), 0.0);
        return unsignedDist + distInsideBox;
    }

    float signedDistToRoundedbox(vec3 p, vec3 center, vec3 size, float smoothing) {
        return signedDistToBox(p, center, size - vec3(smoothing)) - smoothing;
    }

    float signedDistToInfiniteCylinder(vec3 p, vec2 center, float radius) {
        return length(p.xz - center) - radius;
    }

    float signedDistToPlane(vec3 p) {
        return p.y;
    }

    float signedDistToMandelBulb(vec3 p) {
        vec3 z = p;
        float dr = 1.0;
        float r;

        for (int i = 0; i < 15; i++) {
            r = length(z);
            if (r > 2.0) break;

            float theta = acos(z.z / r) * power;
            float phi = atan2(z.y, z.x) * power;
            float zr = pow(r, power);
            dr = pow(r, power - 1.0) * power * dr + 1.0;

            z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
            z += p;
        }

        return 0.5 * log(r) * r / dr;
    }

    float smoothMin(float distA, float distB, float k) {
        float h = max(k - abs(distA - distB), 0.0) / k;
        return min(distA, distB) - h * h * h * k * 1.0 / 6.0;
    }

    vec3 transformPoint(vec3 p) {
        return (invTransformMat * vec4(p, 1.0)).xyz;
    }

    float GetSceneDist(vec3 p) {
        // float box = signedDistToBox(p, vec3(-1.5, 1, 6), vec3(1));
        // float sphere = signedDistToSphere(p, vec4(1.5, 1, 6, 1));
        // float plane = signedDistToPlane(p);
        // float infCylinder = signedDistToInfiniteCylinder(p, vec2(0, 6), 0.5);
        // float roundedBox = signedDistToRoundedbox(p, vec3(-1.5, 1, 6), vec3(1), 0.0);

        vec3 transformed = transformPoint(p);
        float mandelBulb = signedDistToMandelBulb(transformed);

        return mandelBulb;
    }

    float RayMarch(vec3 ro, vec3 rd) {
        float d0 = 0.0;

        for (int i = 0; i < MAX_STEPS; i++) {
            vec3 p = ro + rd * d0;
            float dS = GetSceneDist(p);
            d0 += dS;

            if (d0 > MAX_DIST || abs(dS) < SURF_DIST) break;
        }

        return d0;
    }

    vec3 CalculateNormal (vec3 p) {
        float d = GetSceneDist(p);
        vec2 e = vec2(0.01, 0);

        vec3 n = d - vec3(
            GetSceneDist(p - e.xyy),
            GetSceneDist(p - e.yxy),
            GetSceneDist(p - e.yyx)
        );

        return normalize(n);
    }

    float CalculateLighting (vec3 p) {
        vec3 lightPos = vec3(0, 0.6, -2);
        vec3 l = normalize(lightPos - p);

        vec3 n = CalculateNormal(p);

        float diffuse = clamp(dot(n, l), 0.0, 1.0);

        float d = RayMarch(p + n * SURF_DIST * 2.0, l);
        if (d < length(lightPos - p)) diffuse *= 0.1;

        return diffuse;
    }

    void main(void) {
        // Get the scaled screen space coordinate
        vec2 uv = (gl_FragCoord.xy - 0.5 * viewportSize) / resolution;

        // Convert the ray direction from normalized screen coordinate to world space coordinate
        vec3 ray = normalize(vec3(uv.x, uv.y, 1));

        // Get Camera Position
        vec3 cPos = vec3(0, 0, -5);

        // Cast the ray and calculate the color
        vec3 col = vec3(0.0);
        float d = RayMarch(cPos, ray);

        vec3 p = cPos + ray * d;
        float litColor = CalculateLighting(p);
        col = vec3(litColor);

        gl_FragColor = vec4(col, 1.0);
    }
`;