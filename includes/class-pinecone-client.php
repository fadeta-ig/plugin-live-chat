<?php
/**
 * Pinecone Client Class
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Pinecone_Client {

    private $api_key;
    private $host_url;

    public function __construct() {
        $options = get_option( 'ai_woo_sa_settings' );
        $this->api_key = isset( $options['pinecone_api_key'] ) ? $options['pinecone_api_key'] : '';
        $raw_host = isset( $options['pinecone_host'] ) ? rtrim( $options['pinecone_host'], '/' ) : '';

        // SSRF Guard: Enforce valid Pinecone HTTPS host
        if ( ! empty( $raw_host ) && class_exists( 'AI_Woo_SA_Security_Guard' ) ) {
            $ssrf = AI_Woo_SA_Security_Guard::validate_ssrf_url( $raw_host, array( 'pinecone.io' ) );
            $this->host_url = is_wp_error( $ssrf ) ? '' : $raw_host;
        } else {
            $this->host_url = $raw_host;
        }
    }

    /**
     * Upsert vectors to Pinecone
     */
    public function upsert( $vectors ) {
        if ( empty( $this->api_key ) || empty( $this->host_url ) ) {
            return new WP_Error( 'pinecone_missing_config', 'Pinecone API Key or Host URL is missing.' );
        }

        $url = $this->host_url . '/vectors/upsert';

        $body = array(
            'vectors' => $vectors,
            'namespace' => 'woocommerce_products'
        );

        $response = wp_remote_post( $url, array(
            'headers' => array(
                'Api-Key' => $this->api_key,
                'Content-Type' => 'application/json'
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 30
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        if ( $status_code !== 200 ) {
            return new WP_Error( 'pinecone_error', 'Failed to upsert to Pinecone.', wp_remote_retrieve_body( $response ) );
        }

        return json_decode( wp_remote_retrieve_body( $response ), true );
    }

    /**
     * Delete vectors from Pinecone
     */
    public function delete( $ids ) {
        if ( empty( $this->api_key ) || empty( $this->host_url ) ) {
            return new WP_Error( 'pinecone_missing_config', 'Pinecone API Key or Host URL is missing.' );
        }

        $url = $this->host_url . '/vectors/delete';

        $body = array(
            'ids' => $ids,
            'namespace' => 'woocommerce_products'
        );

        $response = wp_remote_post( $url, array(
            'headers' => array(
                'Api-Key' => $this->api_key,
                'Content-Type' => 'application/json'
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 30
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        if ( $status_code !== 200 ) {
            return new WP_Error( 'pinecone_error', 'Failed to delete from Pinecone.', wp_remote_retrieve_body( $response ) );
        }

        return true;
    }

    /**
     * Query Pinecone vectors
     */
    public function query( $vector, $top_k = 3, $filter = null ) {
        if ( empty( $this->api_key ) || empty( $this->host_url ) ) {
            return new WP_Error( 'pinecone_missing_config', 'Pinecone API Key or Host URL is missing.' );
        }

        $url = $this->host_url . '/query';

        $body = array(
            'namespace' => 'woocommerce_products',
            'vector' => $vector,
            'topK' => $top_k,
            'includeMetadata' => true,
        );

        if ( ! empty( $filter ) ) {
            $body['filter'] = $filter;
        }

        $response = wp_remote_post( $url, array(
            'headers' => array(
                'Api-Key' => $this->api_key,
                'Content-Type' => 'application/json'
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 30
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        if ( $status_code !== 200 ) {
            return new WP_Error( 'pinecone_error', 'Failed to query Pinecone.', wp_remote_retrieve_body( $response ) );
        }

        return json_decode( wp_remote_retrieve_body( $response ), true );
    }
}
